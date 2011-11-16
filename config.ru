
# this is "Murphy", - say hi

# html element (indeed, js object, should be js plugin)
# to be called Clouseau

Camping.goes :Nuclear

require 'pry'
require 'tarpaulin'

Object.const_defined?('CORE') or CORE = File.expand_path(File.dirname(__FILE__))
Object.const_defined?('REACTOR') or REACTOR = 'reactor'
Object.const_defined?('DOC_ROOT') or DOC_ROOT = '/var/www/localhost/htdocs/'

require File.here 'models'

module Nuclear::Helpers
  #
  #
  #
  def set_my_bits
    @bits ||= []
  end
  
  #
  # has edit on the front, get rid of it
  # 
  def top_n_tail *a
    a.slice!(0)
    unique_id = ""
    a.unshift(REACTOR)
    a.unshift(unique_id)
  end
  #
  # the next 3 methods go hand-in-hand
  #  
  def register path
    FileUtils.mkdir_p(path)
    s = File.stat path
    if Pile.where(:inode => s.ino).empty?
      w = Pile.new
      w.inode = s.ino
      w.save!
      dir = File.dirname(path)
      $L.debug dir
      register dir
    end
  end
  
  def interact path
    s = File.stat path
    p = Pile.where(:inode => s.ino).first
    # should not be possible to have duplicates, referential integrity n stuff
    a_t = Assembly.where(:object => 'toolbox').first
    p.assemblies << a_t if Rod.where(:pile_id => p, :assembly_id => a_t).empty?
    a_p = Assembly.where(:object => 'property').first
    p.assemblies << a_p if Rod.where(:pile_id => p, :assembly_id => a_p).empty?
    a_i = Assembly.where(:object => 'inspector').first
    p.assemblies << a_i if Rod.where(:pile_id => p, :assembly_id => a_i).empty?
    $L.debug "Created assemblies"
  end

  def ensure_path(*a)
    a = top_n_tail *a
    
    d = File.expand_path(CORE+'/'+a.join('/'))
    $L.debug d
    if !File.exists? d
      $L.debug "First time for "+d
      register d # make the fs stuff
      e = File.expand_path(CORE+'/'+a.slice(0..2).join('/'))
      interact e # make the assemblies
    end
  end

  #
  # the next 3 methods go hand-in-hand
  #  
  
  def insert assembly, rod
    @bits <<= assembly.object.to_s
  end

  def show_me path, insert_anyway
    s = File.stat path
    return if (p = Pile.where(:inode => s.ino)).empty?
    p = p.first
    $L.debug p
    if p.rods.empty?
      show_me File.dirname(path), false
    else
      p.rods.each do |r|
        a = r.assembly
        if a.see_through or insert_anyway
          insert a, r
        end
      end
    end
  end
  
  def display *a
    a = top_n_tail *a
    
    d = File.expand_path(CORE+'/'+a.join('/'))
    show_me d, true
  end
end

module Nuclear::Controllers
  class Index
    def get
      set_my_bits
    end
  end
  
  class Morph < R ''
    
    require 'mime/types'
    
    def send_file(*a)
      fqfn = File.join(DOC_ROOT, a)
      if !File.exists? fqfn
        r404 { fqfn }
        # is this right?
      else
        mime_type = MIME::Types.type_for(fqfn).first rescue nil
        @headers['Content-Type'] = mime_type.nil? ? "text/plain" : mime_type.to_s
        if fqfn.include? ".." or fqfn.include? "./"
          r403 { fqfn } # these are logged
        else
          # how to cache these?
          # $L.debug fqfn # get system to log it :(
          @headers['X-Sendfile'] = fqfn.to_s # this aint, why not?
          @body = ""
        end
      end
    end
    
    def get(*a)
      # chdir ?
      # create dir FileUtils.mkdir_p
      # get all inodes, store them in widget table
      # show widgets that can be seen in edit mode
      set_my_bits
      $L.debug a
      case a.first
        when 'edit'
          ensure_path *a
          display *a
          @title = "Murphy"
          return render :edit
      end
      #@headers['X-Sendfile'] = File.join(DOC_ROOT, a)
      send_file *a
    end
    
    def self.urls
      endless_path("/([^/]+)")
    end
  end
end

module Nuclear::Views
  def layout
    html_five do
      head do
        title @title
        link "type" => "text/css", "href" => "/cascading_stylesheets/nuclear.css", "rel" => "Stylesheet"
        link "type" => "text/css", "href" => "/cascading_stylesheets/3rd-party/simple-tree-menu-styling/jquery-simple-tree-menu-1.2.5.css", "rel" => "Stylesheet"
        link "type" => "text/css", "href" => "/cascading_stylesheets/3rd-party/custom-theme-pepper-grinder/jquery-ui-pepper-grinder-1.8.16.custom.css", "rel" => "Stylesheet"
        script "src" => "/javascripts/3rd-party/jquery-1.7.min.js" do
        end
        script "src" => "/javascripts/3rd-party/jquery-ui-pepper-grinder-1.8.16.custom.min.js" do
        end
        script "src" => "/javascripts/3rd-party/plugins/jquery-simple-tree-menu-1.2.5.js" do
        end
        script "src" => "/javascripts/nuclear.js" do
        end
      end
      body do
        div.container! do
          div.edit!(:role => "edit") do
          end
        end
        self << yield
      end # end body
    end # end html
  end
  
  def edit
    # need nuclear.erb.js
    js = ''
    js <<= "<script>\n"
    # catch css or js breakage here :) but really this is only a dev issue
    js <<= "var rods = [];\n"
    @bits.each_with_index do |b,i|
      js <<= "rods[#{i}] = '#{b}';\n"
    end
    js <<= "$(function() {\n"
    js <<= "  Reactor.activate(rods);\n"
    js <<= "});\n"
    js <<= "</script>\n"
  end
end

module Nuclear
  include Tarpaulin
  
  def self.create
    yml = YAML::load_file(CORE+'/.nuclear.rc.yml')
    ActiveRecord::Base.logger = $L
    ActiveRecord::Base.establish_connection(yml['locations']['database_connection'])
    ActiveRecord::Base.connection.execute('PRAGMA foreign_keys = ON')
    Nuclear::Models.create_schema
  end
end

# 